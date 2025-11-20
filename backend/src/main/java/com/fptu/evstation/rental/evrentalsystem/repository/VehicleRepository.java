package com.fptu.evstation.rental.evrentalsystem.repository;

import com.fptu.evstation.rental.evrentalsystem.entity.Model;
import com.fptu.evstation.rental.evrentalsystem.entity.Station;
import com.fptu.evstation.rental.evrentalsystem.entity.Vehicle;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long>, JpaSpecificationExecutor<Vehicle> {
    boolean existsByLicensePlate(String licensePlate);
    long countByStation(Station station);
    long countByModel(Model model);
    List<Vehicle> findByStation(Station station, Sort sort);
    @Query("SELECT v.status, COUNT(v) FROM Vehicle v WHERE v.station = :station GROUP BY v.status")
    List<Object[]> countVehiclesByStatus(@Param("station") Station station);
    List<Object[]> getVehicleStatsGroupedByStation();
}
