package com.fptu.evstation.rental.evrentalsystem.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;

@Entity
@Table(name = "Roles", uniqueConstraints = @UniqueConstraint(columnNames = "roleName"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    @Column(name = "roleId")
    private int roleId;
    @Column(name = "roleName", nullable = false, unique = true, length = 50)
    private String roleName;

    @JsonBackReference
    @OneToMany(mappedBy = "role", fetch =  FetchType.LAZY)
    private List<User> users = new ArrayList<>();
}